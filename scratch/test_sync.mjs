async function testSync() {
  const res = await fetch("http://localhost:3000/api/sync-emails", { method: "POST" });
  const data = await res.json();
  console.log(data);
}
testSync();
