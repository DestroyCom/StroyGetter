export const getAPIURL = () => {
  var API_URL: string;
  switch (import.meta.env.VITE_ENV_TYPE) {
    case "dev":
      API_URL = "http://localhost:3100";
      break;
    case "prod":
      API_URL = "https://stroygetter-server.herokuapp.com";
      break;
    case "test":
      API_URL = "https://stroygetter-server.herokuapp.com";
      break;
    default:
      API_URL = "http://localhost:3100";
      break;
  }

  return API_URL;
};
