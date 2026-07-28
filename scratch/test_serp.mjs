async function testSerpApi() {
  const q = "Business in seattle";
  const serpApiKey = "6b25d0abd13122025f80f7d1032f04e150f6651c0b6ce55edb06782e623466a5";
  let allMapped = [];
  let start = 0;
  for (let i = 0; i < 6; i++) {
    const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&start=${start}&api_key=${serpApiKey}`);
    const serpData = await serpRes.json();
    const localResults = serpData.local_results || [];
    console.log(`Page ${i + 1}: Found ${localResults.length} results. Start was ${start}`);
    allMapped.push(...localResults);
    start += 20;
  }
  console.log("Total scraped:", allMapped.length);
}
testSerpApi();
