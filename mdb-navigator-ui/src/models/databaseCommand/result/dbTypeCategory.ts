// What kind of value a result column holds, the same for every database server.
// Keep in sync with src/Providers/MDBNavigator.Providers.Abstractions/Queries/DbTypeCategory.cs.
export type DbTypeCategory = 'Number' | 'Text' | 'Boolean' | 'DateTime' | 'Json' | 'Binary' | 'Other';
