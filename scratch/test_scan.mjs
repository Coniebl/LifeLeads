async function testApify() {
  const req1 = await fetch("http://localhost:3000/api/scan-clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "seattle",
      industries: ["All"],
      category: "Companies",
      engine: "agent2"
    })
  });
  console.log("Agent 2 Status:", req1.status);
  const data1 = await req1.json();
  console.log("Agent 2 Data:", data1);

  const req2 = await fetch("http://localhost:3000/api/scan-clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "seattle",
      industries: ["All"],
      category: "Companies",
      engine: "agent1"
    })
  });
  console.log("Agent 1 Status:", req2.status);
  const data2 = await req2.json();
  console.log("Agent 1 Data:", data2);
}
testApify();
