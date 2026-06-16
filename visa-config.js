// Pictor Services — Visa Cost Estimator Price Configuration
// You can edit the values below manually at any time. Save the file and refresh the calculator.
const VISA_COSTS_CONFIG = {
  "subclasses": {
    "189": {
      "name": "Skilled Independent (Subclass 189)",
      "baseFee": 4765,
      "secondaryApplicant18Plus": 2385,
      "secondaryApplicantUnder18": 1190,
      "skillsAssessmentEst": 1050,
      "agentFee": 3500
    },
    "190": {
      "name": "Skilled Nominated (Subclass 190)",
      "baseFee": 4765,
      "secondaryApplicant18Plus": 2385,
      "secondaryApplicantUnder18": 1190,
      "skillsAssessmentEst": 1050,
      "agentFee": 3800
    },
    "491": {
      "name": "Skilled Work Regional (Subclass 491)",
      "baseFee": 4765,
      "secondaryApplicant18Plus": 2385,
      "secondaryApplicantUnder18": 1190,
      "skillsAssessmentEst": 1050,
      "agentFee": 4000
    },
    "500": {
      "name": "Student Visa (Subclass 500)",
      "baseFee": 1600,
      "secondaryApplicant18Plus": 1190,
      "secondaryApplicantUnder18": 390,
      "skillsAssessmentEst": 0,
      "agentFee": 1200
    },
    "482": {
      "name": "Temporary Skill Shortage (Subclass 482 - Medium Term)",
      "baseFee": 3115,
      "secondaryApplicant18Plus": 3115,
      "secondaryApplicantUnder18": 780,
      "skillsAssessmentEst": 1200,
      "agentFee": 3000
    },
    "820": {
      "name": "Partner Visa (Subclass 820/801)",
      "baseFee": 8850,
      "secondaryApplicant18Plus": 4430,
      "secondaryApplicantUnder18": 2215,
      "skillsAssessmentEst": 0,
      "agentFee": 4500
    }
  },
  "standardFees": {
    "englishTestEst": 410,
    "healthCheckPerPerson": 350,
    "policeCheckPerPerson": 75,
    "creditCardSurchargePercent": 1.4
  }
};

// Export configuration for browser environments
if (typeof window !== 'undefined') {
  window.VISA_COSTS_CONFIG = VISA_COSTS_CONFIG;
}
