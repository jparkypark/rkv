import { DateTime } from 'luxon';
import path from 'path';

export function getFilePath(type: string, date: DateTime): string {
  // Validate DateTime input
  if (!date.isValid) {
    throw new Error(`Invalid date provided: ${date.invalidReason}`);
  }

  const year = date.toFormat('yyyy');
  const month = date.toFormat('MM');
  const dateStr = date.toFormat('yyyy-MM-dd');
  const week = date.toFormat("'W'WW");
  
  switch (type) {
    case 'morning':
    case 'evening':
      return path.join('daily', year, month, `${dateStr}-${type}.md`);
    
    case 'weekly-start':
    case 'weekly-end':
      return path.join('weekly', year, `${year}-${week}-${type.split('-')[1]}.md`);
    
    case 'monthly-start':
    case 'monthly-end':
      return path.join('monthly', year, `${year}-${month}-${type.split('-')[1]}.md`);
    
    default:
      throw new Error(`Unknown entry type: ${type}`);
  }
}

export function processTemplate(template: string, vars: { date: DateTime }): string {
  // Validate DateTime input
  if (!vars.date.isValid) {
    throw new Error(`Invalid date provided for template processing: ${vars.date.invalidReason}`);
  }

  let processed = template;
  
  // Basic date replacement - ISO format (YYYY-MM-DD)
  processed = processed.replace(/{{date}}/g, vars.date.toFormat('yyyy-MM-dd'));
  
  // Format-specific date replacement - supports any Luxon format token
  processed = processed.replace(/{{date:([^}]+)}}/g, (_, format) => {
    try {
      return vars.date.toFormat(format);
    } catch (error) {
      // If format is invalid, return the original placeholder
      console.warn(`Invalid date format token: ${format}`);
      return `{{date:${format}}}`;
    }
  });
  
  // Add some common date format shortcuts
  processed = processed.replace(/{{dateISO}}/g, vars.date.toISO() || '');
  processed = processed.replace(/{{dateShort}}/g, vars.date.toLocaleString(DateTime.DATE_SHORT) || '');
  processed = processed.replace(/{{dateFull}}/g, vars.date.toLocaleString(DateTime.DATE_FULL) || '');
  processed = processed.replace(/{{dateTime}}/g, vars.date.toLocaleString(DateTime.DATETIME_MED) || '');
  
  // Week-specific replacements
  processed = processed.replace(/{{weekNumber}}/g, vars.date.toFormat('WW'));
  processed = processed.replace(/{{weekYear}}/g, vars.date.toFormat('kkkk'));
  processed = processed.replace(/{{weekday}}/g, vars.date.toFormat('cccc'));
  
  // Month-specific replacements
  processed = processed.replace(/{{monthName}}/g, vars.date.toFormat('MMMM'));
  processed = processed.replace(/{{monthShort}}/g, vars.date.toFormat('MMM'));
  processed = processed.replace(/{{monthNumber}}/g, vars.date.toFormat('MM'));
  
  // Year replacements
  processed = processed.replace(/{{year}}/g, vars.date.toFormat('yyyy'));
  processed = processed.replace(/{{yearShort}}/g, vars.date.toFormat('yy'));
  
  return processed;
}

export function validateEntryType(type: string): boolean {
  const validTypes = [
    'morning', 'evening',
    'weekly-start', 'weekly-end',
    'monthly-start', 'monthly-end'
  ];
  
  return validTypes.includes(type);
}

export function getDefaultEntryType(): string {
  const now = DateTime.now();
  const hour = now.hour;
  
  // Default to morning before noon, evening after
  return hour < 12 ? 'morning' : 'evening';
}