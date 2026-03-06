async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/data");
    const data = await res.json();
    console.log("Purchases Count:", data.purchases?.length);
    if (data.purchases && data.purchases.length > 0) {
      console.log("First Purchase Sample:", JSON.stringify(data.purchases[0], null, 2));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
