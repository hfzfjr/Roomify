export function formatFacilityName(name: string): string {
  // Special case: "ac" should become "AC"
  if (name.toLowerCase() === 'ac') {
    return 'AC';
  }

  // Replace underscores with spaces
  const withSpaces = name.replace(/_/g, ' ');

  // Capitalize first letter of each word
  const words = withSpaces.split(' ');
  const capitalizedWords = words.map(word => {
    if (word.length === 0) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return capitalizedWords.join(' ');
}
