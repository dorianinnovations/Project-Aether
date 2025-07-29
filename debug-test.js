// Simple test to debug the regex issue
const testRegex = /\*\*(.*?)\*\*/g;
console.log('Test regex works:', testRegex.test('**bold**'));

// Test other regexes
const spaceRegex = /\s/g;
console.log('Space regex works:', spaceRegex.test('hello world'));

const camelCaseRegex = /([A-Z])/g;
console.log('CamelCase regex works:', camelCaseRegex.test('camelCase'));