async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/data");
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
