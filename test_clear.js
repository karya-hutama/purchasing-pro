const url = "https://script.google.com/macros/s/AKfycbwQtPv4mSc7Kz7rfSl8QWhgw0HFO46NZ2nbpnFjxeteoVYrtCB7mW0PCaNHReXyb_5SpQ/exec";

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
