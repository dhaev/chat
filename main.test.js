
const io = require('socket.io-client');
const axios = require('axios');
const jquery = require('jquery');
const { JSDOM } = require('jsdom');
const { ChatApp } = require('./public/js/app'); // replace with your actual file name


jest.mock('axios', () => ({
  create: () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  }),
}));


describe('ChatApp', () => {
  let chatApp;
  let dom;

  beforeEach(() => {
    // Set up a mock DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <body>
        <form id="chat-form"></form>
        <div class="chat-history"></div>
        <div id="room-name"></div>
        <div id="chat-with"></div>
        <div id="users"></div>
        <div id="profile-id"></div>
        <div id="profile-displayName"></div>
        <input id="searchuser">
        <div class="chat-history"></div> <!-- Add this if your methods interact with it -->
        <button id="deleteMessage"></button> <!-- Add this if your methods interact with it -->
        <button id="deleteConversation"></button> <!-- Add this if your methods interact with it -->
      </body>
    </html>
    `);

    // Create a new ChatApp instance
    chatApp = new ChatApp();

    // Replace the global document object with the mock DOM
    global.document = dom.window.document;
    global.$ = jquery(dom.window);
  });

  describe('setChatName', () => {
    it('should set the chat name', () => {
      const user = { _id: '1', displayName: 'Test User' };
      chatApp.initialize();
      chatApp.setChatName(user);
      expect(chatApp.roomName.innerHTML).toBe('1');
      expect(chatApp.chatWith.innerHTML).toBe('Test User');
    });
  });

  describe('getRequest', () => {
    it('should make a GET request', async () => {
      const mockResponse = { data: 'response' };
      chatApp.apiClient.get.mockResolvedValue(mockResponse);
      const response = await chatApp.getRequest('endpoint', { param: 'value' });
      expect(response).toBe('response');
    });
  });

  describe('postRequest', () => {
    it('should make a POST request', async () => {
      const mockResponse = { data: 'response' };
      chatApp.apiClient.post.mockResolvedValue(mockResponse);
      const response = await chatApp.postRequest('endpoint', { data: 'David' });
      expect(response).toBe('response');
    });
  });

  describe('deleteRequest', () => {
    it('should make a DELETE request', async () => {
      const mockResponse = { data: 'response' };
      chatApp.apiClient.delete.mockResolvedValue(mockResponse);
      const response = await chatApp.deleteRequest('endpoint', { data: 'value' });
      expect(response).toBe('response');
    });
  });
  // Add more tests here
  describe('Search for User', () => {
    it('should make a GET request to /dashboard/searchUsers', async () => {
      const mockResponse = {
        data: [
          {
            "_id": "65b53ec3b7c8c8c5f98",
            "googleId": "108561678371568587775",
            "displayName": "mon goose",
            "firstName": "mon",
            "lastName": "hoose",
            "image": "https://lh3.googleusercontent.com/a/ACg8ocKZTeTMx8WidmG2XFEqQeWrPQinG5judQ0AJwhUPMUs=s96-c",
            "contacts": [
              "65b53ed2b7c8c8c5f983ea7d"
            ],
            "createdAt": "2024-01-27T17:34:59.909Z",
            "__v": 0
          }
        ]
      };
      chatApp.apiClient.get.mockResolvedValue(mockResponse);
      const response = await chatApp.getRequest('/dashboard/searchUsers', { param: 'Testing' });
      console.log('Search for User test response: '+ response[0].displayName)
      expect(response).toEqual(mockResponse.data);

    });
  });
  

  it('should return an empty array when no user is found', async () => {
    const mockResponse = {
      data: [] // no user found
    };
    chatApp.apiClient.get.mockResolvedValue(mockResponse);
    const response = await chatApp.getRequest('/dashboard/searchUsers', { param: '' });
    expect(response).toEqual(mockResponse.data);
  });



  describe('getRequest', () => {
    it('should make a GET request and return the response data', async () => {
      const chatApp = new ChatApp();
      const mockResponse = { data: 'test data' };
      chatApp.apiClient.get = jest.fn().mockResolvedValue(mockResponse);

      const endpoint = '/test-endpoint';
      const params = { param: 'test param' };

      const response = await chatApp.getRequest(endpoint, params);

      expect(chatApp.apiClient.get).toHaveBeenCalledWith(endpoint, { params });
      expect(response).toBe(mockResponse.data);
    });
  });


  describe('postRequest', () => {
    it('should make a POST request and return the response data', async () => {
      const chatApp = new ChatApp();
      const mockResponse = { data: 'test data' };
      chatApp.apiClient.post = jest.fn().mockResolvedValue(mockResponse);

      const endpoint = '/test-endpoint';
      const data = { key: 'test data' };

      const response = await chatApp.postRequest(endpoint, data);

      expect(chatApp.apiClient.post).toHaveBeenCalledWith(endpoint, data);
      expect(response).toBe(mockResponse.data);
    });
  });

  describe('deleteRequest', () => {
    it('should make a DELETE request and return the response data', async () => {
      const chatApp = new ChatApp();
      const mockResponse = { data: 'test data' };
      chatApp.apiClient.delete = jest.fn().mockResolvedValue(mockResponse);

      const endpoint = '/test-endpoint';
      const data = { key: 'test data' };

      const response = await chatApp.deleteRequest(endpoint, data);

      expect(chatApp.apiClient.delete).toHaveBeenCalledWith(endpoint, { data });
      expect(response).toBe(mockResponse.data);
    });
  });



  describe('getChatId', () => {
    it('should generate a chat ID', () => {
      chatApp.initialize();
      chatApp.profileId.innerText = '1';
      chatApp.roomName.innerText = '2';
      const chatId = chatApp.getChatId();
      expect(chatId).toBe('1_2');
    });
  });

  describe('getConversation', () => {
    it('should send an API request and update the chat', async () => {
      const mockUser = { _id: '1', displayName: 'Test User' };
      const mockResponse = { data: { messages: [{ "sender":"1", "content":"Hello" }, 
      {"sender":"2","content":"World"}] 
     }};
      chatApp.initialize();
      chatApp.profileId.innerText = '1';
      chatApp.roomName.innerText = '2';
      chatApp.apiClient.get.mockResolvedValue(mockResponse);
      await chatApp.getConversation(btoa(JSON.stringify(mockUser)));
      expect(chatApp.chatMessages.innerHTML).toContain('Hello');
      expect(chatApp.chatMessages.innerHTML).toContain('World');
    });
  });

  describe('deletemessage', () => {
    it('should delete a message', async () => {
      const mockResponse = { data: 'response' };
      chatApp.initialize();
      chatApp.apiClient.delete.mockResolvedValue(mockResponse);
      await chatApp.deletemessage('conversationId', 'messageId');
      // Add assertions based on your application's behavior
    });
  });

  describe('deleteconversation', () => {
    it('should delete a conversation', async () => {
      const mockResponse = { data: 'response' };
      chatApp.initialize();
      chatApp.apiClient.delete.mockResolvedValue(mockResponse);
      await chatApp.deleteconversation();
      // Add assertions based on your application's behavior
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockResponse = { data: { message: 'Hello' } };
      chatApp.initialize();
      chatApp.profileId.innerText = '1';
      chatApp.roomName.innerText = '2';
      chatApp.apiClient.post.mockResolvedValue(mockResponse);
      const mockEvent = {
        preventDefault: jest.fn(),
        target: { elements: { msg: { value: 'Hello', focus: jest.fn() } } }
      };
      await chatApp.sendMessage(mockEvent);
      // Add assertions based on your application's behavior
    });
  });

  describe('outputMessage', () => {
    it('should output a message to the chat', () => {
      chatApp.initialize();
      chatApp.outputMessage({ "sender":"1", "content":"Hello" });
      expect(chatApp.chatMessages.innerHTML).toContain('Hello');
    });
  });

  describe('outputMessage empty', () => {
    it('should output a message to the chat', () => {
      chatApp.initialize();
      chatApp.outputMessage();
      expect(chatApp.chatMessages.innerHTML).toContain('');
    });
  });
 

});


