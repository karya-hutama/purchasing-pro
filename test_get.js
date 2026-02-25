const url = "https://script.google.com/macros/s/AKfycbzZvhbhrOZpfHeJNHmZLdOZ_pLacnhKPBbaN7QYERnt0OZwI0iZNSdLtNyFwaIVlv05_A/exec";

async function test() {
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
