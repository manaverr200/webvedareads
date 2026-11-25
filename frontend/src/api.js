export async function requestJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function withMinimumLoader(request) {
  const minimumTime = new Promise((resolve) => setTimeout(resolve, 750));

  try {
    return await request;
  } finally {
    // A fast rejection should get the same loading treatment as a fast success.
    await minimumTime;
  }
}
