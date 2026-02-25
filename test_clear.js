const url = "https://script.google.com/macros/s/AKfycbzZvhbhrOZpfHeJNHmZLdOZ_pLacnhKPBbaN7QYERnt0OZwI0iZNSdLtNyFwaIVlv05_A/exec";

async function test() {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'syncLocations', data: [] })
    });
    console.log("Cleared locations");
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
