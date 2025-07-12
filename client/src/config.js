const baseUrl = import.meta.env.VITE_PUBLIC_API_URL;

const fetchData = async (url, method, body = null, headers = null) => {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (method !== 'GET' && method !== 'HEAD' && body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${url}`, options);
  const resData = await res.json();

  return { status: res.status, data: resData };
};

export { fetchData };
