/* eslint-disable no-console, no-unused-vars */
// Simple test to check if atom.read works
const atom = {
  id: Symbol('test'),
  type: 'computed',
  name: 'test-atom',
  read: (get) => get(null) * 2
};

console.log('Atom:', atom);
console.log('Atom type:', typeof atom);
console.log('Has read property:', 'read' in atom);
console.log('Read type:', typeof atom.read);
console.log('Read is function:', typeof atom.read === 'function');

// Test calling read
try {
  const result = atom.read(() => 5);
  console.log('Read result:', result);
} catch (e) {
  console.log('Error calling read:', e.message);
}

// Test with primitive atom
const primitiveAtom = {
  id: Symbol('test-primitive'),
  type: 'primitive',
  name: 'test-primitive-atom',
  read: () => 42
};

console.log('\nPrimitive atom:');
console.log('Has read property:', 'read' in primitiveAtom);
console.log('Read type:', typeof primitiveAtom.read);
console.log('Read result:', primitiveAtom.read());
