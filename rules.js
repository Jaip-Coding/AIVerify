const RULESET = {
  version: '2026.08.31-v1',
  effectiveDate: '2026-08-02',
  jurisdiction: 'European Union',
  scope: 'Selected transparency readiness checks, primarily Article 50 of Regulation (EU) 2024/1689',
  sources: [
    {
      label: 'Regulation (EU) 2024/1689 — Article 50',
      url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'
    },
    {
      label: 'European Commission — Guidelines on transparency obligations',
      url: 'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems'
    },
    {
      label: 'European Commission — Transparency obligations overview',
      url: 'https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations'
    }
  ]
};

function result(id, title, status, summary, basis, confidence, evidence = []) {
  return { id, title, status, summary, basis, confidence, evidence };
}

function answer(q, key) {
  return q && Object.prototype.hasOwnProperty.call(q, key) ? q[key] : 'unknown';
}

function evaluateAssessment(scan, q = {}) {
  const findings = [];
  const customerFacing = answer(q, 'customerFacingAI');
  const informed = answer(q, 'usersInformedAI');
  const providerGenerative = answer(q, 'providerGenerativeAI');
  const machineMarked = answer(q, 'machineReadableMarking');
  const emotion = answer(q, 'emotionRecognition');
  const biometric = answer(q, 'biometricCategorisation');
  const deepfake = answer(q, 'deepfakes');
  const publicInterest = answer(q, 'publicInterestAIText');

  const detectedInteractive = !!scan?.signals?.interactiveAI?.detected;
  const detectedDisclosure = !!scan?.signals?.aiDisclosure?.detected;

  if (customerFacing === 'yes' || detectedInteractive) {
    if (informed === 'yes' || detectedDisclosure) {
      findings.push(result(
        'A50-1',
        'Direct AI interaction disclosure',
        'pass',
        'Evidence indicates users are informed when interacting directly with an AI system.',
        'Article 50(1)',
        informed === 'yes' && detectedDisclosure ? 'high' : 'medium',
        [
          ...(detectedDisclosure ? scan.signals.aiDisclosure.evidence : []),
          ...(informed === 'yes' ? ['Company confirmed that users are informed.'] : [])
        ]
      ));
    } else if (informed === 'no') {
      findings.push(result(
        'A50-1',
        'Direct AI interaction disclosure',
        'review',
        'A directly interactive AI system is indicated, while the company stated that users are not informed. This should be reviewed against Article 50(1), including any applicable exception.',
        'Article 50(1)',
        'high',
        detectedInteractive ? scan.signals.interactiveAI.evidence : ['Company confirmed direct AI interaction.']
      ));
    } else {
      findings.push(result(
        'A50-1',
        'Direct AI interaction disclosure',
        'unknown',
        'A directly interactive AI system may be present, but the assessment cannot verify whether users are adequately informed in the actual interaction flow.',
        'Article 50(1)',
        detectedInteractive ? 'medium' : 'low',
        detectedInteractive ? scan.signals.interactiveAI.evidence : []
      ));
    }
  } else if (customerFacing === 'no' && !detectedInteractive) {
    findings.push(result(
      'A50-1',
      'Direct AI interaction disclosure',
      'na',
      'No customer-facing interactive AI system was declared or detected in the scanned page.',
      'Article 50(1)',
      'medium',
      []
    ));
  } else {
    findings.push(result(
      'A50-1',
      'Direct AI interaction disclosure',
      'unknown',
      'The scanner did not conclusively detect an interactive AI system. Company confirmation is required.',
      'Article 50(1)',
      'low',
      []
    ));
  }

  if (providerGenerative === 'yes') {
    if (machineMarked === 'yes') {
      findings.push(result(
        'A50-2',
        'Machine-readable marking of generated outputs',
        'pass',
        'The company states that generated or manipulated outputs are marked in a machine-readable and detectable format.',
        'Article 50(2)',
        'medium',
        ['Company declaration. Technical implementation was not independently verified.']
      ));
    } else if (machineMarked === 'no') {
      findings.push(result(
        'A50-2',
        'Machine-readable marking of generated outputs',
        'review',
        'The company identifies itself as a provider of generative AI but states that outputs are not machine-readably marked. Review Article 50(2) and applicable technical feasibility/exception details.',
        'Article 50(2)',
        'high',
        ['Company declaration.']
      ));
    } else {
      findings.push(result(
        'A50-2',
        'Machine-readable marking of generated outputs',
        'unknown',
        'The company may be a provider of generative AI, but implementation of machine-readable output marking has not been confirmed.',
        'Article 50(2)',
        'medium',
        []
      ));
    }
  } else if (providerGenerative === 'no') {
    findings.push(result(
      'A50-2',
      'Machine-readable marking of generated outputs',
      'na',
      'The company states that it is not the provider of a generative AI system for this assessment.',
      'Article 50(2)',
      'medium',
      ['Company declaration.']
    ));
  } else {
    findings.push(result(
      'A50-2',
      'Machine-readable marking of generated outputs',
      'unknown',
      'Provider status and generative-output marking cannot be inferred reliably from a public website scan.',
      'Article 50(2)',
      'low',
      []
    ));
  }

  const exposureRules = [
    ['A50-3-emotion', 'Emotion recognition transparency', emotion, 'emotion recognition', 'Article 50(3)'],
    ['A50-3-biometric', 'Biometric categorisation transparency', biometric, 'biometric categorisation', 'Article 50(3)'],
    ['A50-4-deepfake', 'Deepfake disclosure', deepfake, 'deepfake content', 'Article 50(4)'],
    ['A50-4-public', 'AI-generated public-interest text disclosure', publicInterest, 'AI-generated text concerning matters of public interest', 'Article 50(4)']
  ];

  for (const [id, title, value, subject, basis] of exposureRules) {
    if (value === 'no') {
      findings.push(result(id, title, 'na', `The company states that it does not use ${subject} in the assessed context.`, basis, 'medium', ['Company declaration.']));
    } else if (value === 'yes') {
      findings.push(result(id, title, 'unknown', `Use of ${subject} was confirmed. The MVP cannot verify the exact disclosure implementation or whether an exception applies, so human review is required.`, basis, 'medium', ['Company declaration.']));
    } else {
      findings.push(result(id, title, 'unknown', `The public website scan cannot determine whether the company uses ${subject}.`, basis, 'low', []));
    }
  }

  findings.push(result(
    'GOV-1',
    'Internal AI inventory',
    answer(q, 'aiInventory') === 'yes' ? 'pass' : answer(q, 'aiInventory') === 'no' ? 'review' : 'unknown',
    answer(q, 'aiInventory') === 'yes'
      ? 'The company states that it maintains an inventory of AI systems.'
      : answer(q, 'aiInventory') === 'no'
        ? 'No internal AI inventory is maintained. Creating one would materially improve governance and future assessment coverage.'
        : 'A public website scan cannot verify internal AI-system governance.',
    'Governance readiness check — not itself a standalone Article 50 requirement',
    'medium',
    answer(q, 'aiInventory') !== 'unknown' ? ['Company declaration.'] : []
  ));

  const actionable = findings.filter(f => !['na'].includes(f.status));
  const known = actionable.filter(f => !['unknown'].includes(f.status));
  const pass = findings.filter(f => f.status === 'pass').length;
  const review = findings.filter(f => f.status === 'review').length;
  const unknown = findings.filter(f => f.status === 'unknown').length;
  const na = findings.filter(f => f.status === 'na').length;
  const coverage = actionable.length ? Math.round((known.length / actionable.length) * 100) : 100;
  const assessedReadiness = known.length ? Math.round((pass / known.length) * 100) : null;

  return {
    ruleset: RULESET,
    findings,
    summary: { pass, review, unknown, na, coverage, assessedReadiness }
  };
}

module.exports = { RULESET, evaluateAssessment };
