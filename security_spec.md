# Security Specification

## Data Invariants
1. Specialists, Approaches, and InsurancePlans are public for reading but restricted to authorized admins for writing.
2. Settings are public for reading but restricted to authorized admins for writing.
3. Every write must match the strict schema defined in the blueprint.

## Dirty Dozen Payloads
1. Create a specialist as an unauthenticated user (Denied)
2. Create a specialist as an authenticated user without admin role (Denied)
3. Update specialist with a "ghost field" not in schema (Denied)
4. Update specialist with invalid type for ageGroups (Denied)
5. Update specialist with extremely large string for name (Denied)
6. Delete specialist as non-admin (Denied)
7. Create insurance plan with invalid logo URL (Denied)
8. Update site settings as non-admin (Denied)
9. Update specialist ownerId to spoof ownership (Denied)
10. Update specialist with empty required fields (Denied)
11. Update specialist CRP with non-string type (Denied)
12. Create approach with script tag in description (Denied)

## Test Runner (Simplified)
The security rules will be validated via ESLint and manual logic check.
