const assert = require('node:assert/strict');
const { analyseHtml, isPrivateIp } = require('./scanner');
const { evaluateAssessment } = require('./rules');

assert.equal(isPrivateIp('127.0.0.1'), true);
assert.equal(isPrivateIp('10.1.2.3'), true);
assert.equal(isPrivateIp('192.168.1.1'), true);
assert.equal(isPrivateIp('8.8.8.8'), false);

const html = `<!doctype html><title>Acme</title><script src="https://widget.intercom.io/widget/abc"></script><body><p>Our AI-powered assistant can help you.</p></body>`;
const scan = analyseHtml(html, 'https://acme.example/', 200, 'text/html');
assert.equal(scan.signals.interactiveAI.detected, true);
assert.equal(scan.signals.aiDisclosure.detected, true);

const assessment = evaluateAssessment(scan, {
  customerFacingAI: 'yes', usersInformedAI: 'yes', providerGenerativeAI:'no', machineReadableMarking:'unknown',
  emotionRecognition:'no', biometricCategorisation:'no', deepfakes:'no', publicInterestAIText:'no', aiInventory:'yes'
});
assert.ok(assessment.findings.some(f => f.id === 'A50-1' && f.status === 'pass'));
assert.ok(assessment.summary.pass >= 2);
console.log('All tests passed.');
