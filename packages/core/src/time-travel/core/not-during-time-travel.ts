/**
 * Helper function to execute a method while protecting from concurrent time travel operations.
 * 
 * @param context - The object containing the isTimeTraveling flag
 * @param methodName - Name of the method being called (for return value determination)
 * @param fn - The function to execute
 * @returns The result of the function execution
 */
export function executeNotDuringTimeTravel<T>(
  context: { isTimeTraveling: boolean },
  methodName: string,
  fn: () => T
): T {
  // Block if a time travel operation is already in progress
  if (context.isTimeTraveling) {
    // Return appropriate value based on method type
    if (methodName.startsWith('capture')) {
      return undefined as unknown as T;
    }
    return false as unknown as T;
  }
  
  // Set the flag
  context.isTimeTraveling = true;
  
  try {
    return fn();
  } finally {
    // Guarantee flag reset even if an error occurs
    context.isTimeTraveling = false;
  }
}
