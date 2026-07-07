const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Config mapping for each visa subclass
const SUBCLASS_CONFIGS = [
  {
    subclass: '189',
    searchTerm: '189',
    visaName: '189',
    stream: 'Points-Tested'
  },
  {
    subclass: '190',
    searchTerm: '190',
    visaName: '190',
    stream: null
  },
  {
    subclass: '491',
    searchTerm: '491',
    visaName: '491',
    stream: 'State/Territory'
  },
  {
    subclass: '500',
    searchTerm: '500',
    visaName: '500',
    stream: 'Higher Education'
  },
  {
    subclass: '482',
    searchTerm: '482',
    visaName: '482',
    stream: 'Core Skills'
  },
  {
    subclass: '820',
    searchTerm: '820',
    visaName: '820',
    stream: null
  }
];

const TARGET_URL = 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times';

/**
 * Main scraping function.
 * @returns {Promise<Object>} Updated JSON object structure.
 */
async function scrapeDhaVisaTimes() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  
  // Anti-bot evasions
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  // Map to collect scraped results
  const scrapedResults = {};

  try {
    for (const config of SUBCLASS_CONFIGS) {
      console.log(`\nProcessing subclass ${config.subclass}...`);
      try {
        // Navigate to the target page fresh each time to reset states
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Wait for Select2 replacement container to render
        const select2ContainerSelector = 'span.select2-selection--single';
        await page.waitForSelector(select2ContainerSelector, { timeout: 15000 });
        
        // Settle delay for dynamic script initialization
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

        // Click Select2 to open dropdown
        await page.click(select2ContainerSelector);

        // Wait for search field
        const searchInputSelector = 'input.select2-search__field';
        await page.waitForSelector(searchInputSelector, { timeout: 5000 });
        await page.focus(searchInputSelector);
        
        // Type the subclass search term
        await page.keyboard.type(config.searchTerm, { delay: 50 });
        
        // Wait for options list to populate and contain target text
        await page.waitForFunction((visaName) => {
          const options = Array.from(document.querySelectorAll('.select2-results__option'));
          return options.some(opt => opt.textContent.toLowerCase().includes(visaName.toLowerCase()));
        }, { timeout: 10000 }, config.visaName);

        // Find the unique option ID
        const optionId = await page.evaluate((visaName) => {
          const options = Array.from(document.querySelectorAll('.select2-results__option'));
          const target = options.find(opt => opt.textContent.toLowerCase().includes(visaName.toLowerCase()));
          return target ? target.id : null;
        }, config.visaName);

        if (!optionId) {
          console.warn(`Could not find Select2 option ID for subclass ${config.subclass}.`);
          continue;
        }

        // Native click on the option ID
        await page.click(`#${optionId}`);

        // Wait a brief moment for the Select2 selection to register
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

        // Set Visa Stream if config has it and element exists
        if (config.stream) {
          await page.evaluate((streamName) => {
            const selectEl = document.getElementById('visastream');
            if (selectEl) {
              const option = Array.from(selectEl.options).find(opt => 
                opt.text.toLowerCase().includes(streamName.toLowerCase()) || 
                opt.value.toLowerCase().includes(streamName.toLowerCase())
              );
              if (option) {
                selectEl.value = option.value;
                if (window.jQuery) {
                  window.jQuery(selectEl).trigger('change');
                }
              }
            }
          }, config.stream);
          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 800)));
        }

        // Set a valid application date (use a recent static date to ensure stable baseline)
        await page.evaluate(() => {
          const dateInput = document.getElementById('applicationdate');
          if (dateInput) {
            dateInput.value = '01/07/2026';
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Submit the form
        const submitButtonSelector = 'button#visualtrackerbutton';
        await page.waitForSelector(submitButtonSelector);
        await page.click(submitButtonSelector);

        // Wait for text "90% processed in" to render on page
        await page.waitForFunction(() => {
          return document.body.innerText.includes('90% processed in');
        }, { timeout: 15000 });

        // Extract raw inner text from body
        const pageText = await page.evaluate(() => document.body.innerText);

        // Parse using precise regex matching only the number and the unit (e.g. 8 Months, 16 Days)
        const match90 = pageText.match(/90% processed in\s+([0-9]+\s+(?:Month|Day|Year)s?)/i);
        if (match90 && match90[1]) {
          const rawTime = match90[1].trim(); // e.g. "8 Months"
          const tokens = rawTime.split(/\s+/);
          const baseValue = parseInt(tokens[0], 10);
          const unit = tokens[1] ? tokens[1].charAt(0).toUpperCase() + tokens[1].slice(1).toLowerCase() : 'Days';
          
          if (!isNaN(baseValue)) {
            scrapedResults[config.subclass] = {
              base: baseValue,
              unit: unit.endsWith('s') ? unit : unit + 's' // Normalize plurals
            };
            console.log(`Successfully scraped Subclass ${config.subclass}: ${baseValue} ${unit}`);
          }
        } else {
          console.warn(`Could not extract time from output text for subclass ${config.subclass}`);
        }
      } catch (err) {
        console.error(`Failed to process subclass ${config.subclass}:`, err.message);
      }
    }
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }

  return scrapedResults;
}

/**
 * Updates a local json file path with the scraped data.
 */
async function updateLocalFile(scrapedData) {
  const filePath = path.join(__dirname, '../processing-times.json');
  console.log(`Updating local JSON file at: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Local file not found at path: ${filePath}`);
  }

  const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update subclasses
  jsonContent.subclasses.forEach(subclass => {
    const scraped = scrapedData[subclass.value];
    if (scraped) {
      subclass.base = scraped.base;
      subclass.unit = scraped.unit;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
  console.log('Local processing-times.json updated successfully!');
}

/**
 * Updates a Google Cloud Storage file with the scraped data.
 */
async function updateGCSFile(scrapedData) {
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage();
  
  const bucketName = process.env.GCS_BUCKET_NAME || process.env.GCS_BUCKET;
  const fileName = 'processing-times.json'; // The file name in the bucket

  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is not defined.');
  }

  console.log(`Downloading ${fileName} from GCS bucket: ${bucketName}...`);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  // Check if file exists in bucket, download it
  const [exists] = await file.exists();
  let jsonContent;

  if (exists) {
    const [content] = await file.download();
    jsonContent = JSON.parse(content.toString('utf8'));
  } else {
    // Fallback template if it does not exist in bucket yet
    jsonContent = {
      subclasses: [
        { "value": "189", "text": "Skilled Independent (Subclass 189)", "base": 6, "unit": "Months" },
        { "value": "190", "text": "Skilled Nominated (Subclass 190)", "base": 7, "unit": "Months" },
        { "value": "491", "text": "Skilled Work Regional (Subclass 491)", "base": 12, "unit": "Months" },
        { "value": "500", "text": "Student Visa (Subclass 500 - Higher Education)", "base": 35, "unit": "Days" },
        { "value": "482", "text": "Temporary Skill Shortage (Subclass 482)", "base": 25, "unit": "Days" },
        { "value": "820", "text": "Partner Visa (Subclass 820)", "base": 18, "unit": "Months" }
      ],
      modifiers: {
        notComplete: 0.3,
        notBiometrics: 0.2,
        notResponse: 0.4
      }
    };
  }

  // Update subclasses
  jsonContent.subclasses.forEach(subclass => {
    const scraped = scrapedData[subclass.value];
    if (scraped) {
      subclass.base = scraped.base;
      subclass.unit = scraped.unit;
    }
  });

  console.log(`Uploading updated ${fileName} back to GCS bucket: ${bucketName}...`);
  await file.save(JSON.stringify(jsonContent, null, 2), {
    contentType: 'application/json',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=3600', // Cache on CDN for 1 hour
    }
  });
  console.log('GCS processing-times.json updated successfully!');
}

/**
 * Entry point for GCP Cloud Function (triggered via HTTP request).
 */
exports.scrapeVisaTimes = async (req, res) => {
  try {
    const scrapedData = await scrapeDhaVisaTimes();
    await updateGCSFile(scrapedData);
    res.status(200).json({
      success: true,
      message: 'Scrape and GCS update completed successfully.',
      data: scrapedData
    });
  } catch (err) {
    console.error('Error executing Cloud Function scraper:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// If executing directly (e.g. node scraper.js --local or node scraper.js)
if (require.main === module) {
  const isLocal = process.argv.includes('--local') || !process.env.GCS_BUCKET_NAME;
  
  (async () => {
    try {
      const scrapedData = await scrapeDhaVisaTimes();
      console.log('\nScrape Summary:', scrapedData);
      
      if (isLocal) {
        await updateLocalFile(scrapedData);
      } else {
        await updateGCSFile(scrapedData);
      }
      process.exit(0);
    } catch (err) {
      console.error('Fatal execution error:', err);
      process.exit(1);
    }
  })();
}
