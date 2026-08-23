/**
 * Standard Work Item templates for Home Loan Application Verification Checklist
 */
const STANDARD_WORK_ITEMS = [
  {
    type: 'CIBIL_CHECK',
    title: 'Run CIBIL Score Check',
    description: 'Pull applicant credit score from CIBIL bureau. Flag if score is below 650.',
  },
  {
    type: 'DOCUMENT_VERIFICATION',
    title: 'Verify Financial Documents',
    description: 'Verify 6-month bank statements, last 3 years ITR, and 3 salary slips.',
  },
  {
    type: 'LEGAL_TITLE_SEARCH',
    title: 'Legal Title Search',
    description: 'Validate property title deed, encumbrance certificate, and ownership chain.',
  },
  {
    type: 'PROPERTY_VALUATION',
    title: 'Property Site Valuation',
    description: 'Arrange approved valuer site visit and obtain valuation report.',
  },
  {
    type: 'FINAL_REVIEW',
    title: 'Final Sanction Review',
    description: 'Manager reviews all completed verifications and issues final credit decision.',
  },
];

module.exports = {
  STANDARD_WORK_ITEMS,
};
