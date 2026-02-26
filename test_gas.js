import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const res = await fetch(process.env.VITE_GAS_URL);
    const text = await res.text();
    console.log("Response from GAS:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
