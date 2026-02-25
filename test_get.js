const url = "https://script.google.com/macros/s/AKfycbwQtPv4mSc7Kz7rfSl8QWhgw0HFO46NZ2nbpnFjxeteoVYrtCB7mW0PCaNHReXyb_5SpQ/exec";

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
