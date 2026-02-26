export const fetchFromGoogleSheets = async () => {
  try {
    const response = await fetch(`/api/data?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from local API:', error);
    return null;
  }
};

export const syncToGoogleSheets = async (action: string, data: any) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });
  } catch (error) {
    console.error('Error syncing to local API:', error);
  }
};
