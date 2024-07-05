class ApiService {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    getUserEndpoint(userId: string): string {
      return `${this.baseUrl}/users/${userId}`;
    }
  }
  
  export default ApiService;
  