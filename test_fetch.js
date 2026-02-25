const url = "https://script.google.com/macros/s/AKfycbzZvhbhrOZpfHeJNHmZLdOZ_pLacnhKPBbaN7QYERnt0OZwI0iZNSdLtNyFwaIVlv05_A/exec";

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        action: 'syncLocations',
        data: [{ Name: 'Toko Test 1' }]
      })
    });
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
