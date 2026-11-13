// What kind of value a result column holds, the same for every database server.
// Keep in sync with MDBNavigator.Domain/Enums/DbTypeCategory.cs.
export type DbTypeCategory = 'Number' | 'Text' | 'Boolean' | 'DateTime' | 'Json' | 'Binary' | 'Other';
