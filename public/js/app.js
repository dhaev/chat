class ChatApp {
    constructor() {
        this.chatForm = null;
        this.chatMessages = null;
        this.roomName = null;
        this.chatWith = null;
        this.userList = null;
        this.profileId = null;
        this.profileName = null;
        this.searchUser = null;
        this.socket = null; 
        // this.socket = require('socket.io-client')();
        // this.axios = require('axios');
        this.apiClient = axios.create({
            baseURL: 'http://localhost:3000', // replace with your API base URL
            withCredentials: true,
        });
    }

    initialize() {
        this.chatForm = document.getElementById('chat-form');
        this.chatMessages = document.querySelector('.chat-history');
        this.roomName = document.getElementById('room-name');
        this.chatWith = document.getElementById('chat-with');
        this.userList = document.getElementById('users');
        this.profileId = document.getElementById('profile-id');
        this.profileName = document.getElementById('profile-displayName');
        this.searchUser = document.querySelector('#searchuser');

        document.body.addEventListener('click', function (event) {
            $('.popover').remove();
        });

        this.searchUser.addEventListener('keyup', this.findUsers.bind(this));
        this.chatMessages.addEventListener('click', this.messageOptions.bind(this));
        this.chatForm.addEventListener('submit', this.sendMessage.bind(this));
        this.socket = io(); 

        this.socket.on('roomUsers', ({ room, users }) => {
            outputRoomName(room);
            outputUsers(users);
          });
          
          //message from server
          this.socket.on('message', this.socketSendMessage.bind(this));
          
          
          
          this.socket.on("deletemessage", this.socketDeleteMessage.bind(this));
        
   
    }


    socketSendMessage(roomname, msg, senderId) {
        if (roomname === this.getChatId()) {
          console.log('message sent: ' + msg)
          this.outputMessage(msg);
          this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        } else {
          // Get the child element with the specific id
          var unreadElement = document.getElementById("unread_"+senderId);
      
          // If the child element is found
          if (unreadElement) {
            console.log('Element found');
         
            unreadElement.innerHTML = parseInt(unreadElement.innerHTML) + 1;
            unreadElement.removeAttribute('hidden');
      
      
          } else {
            console.log('Element not found');
          }
      
        }
      
        //scroll down
       
      }


      socketDeleteMessage(roomname, msg) {
        if (roomname === this.getChatId()) {
        let element = document.getElementById(msg);
        if (element) {
            let parent = element.closest('.clearfix');
            if (parent) {
            parent.parentNode.removeChild(parent);
            }
        }
        console.log("trying to delete response");  // Log the response
    
    
        }
    }
    messageOptions(event) {
        // Your existing code here
        if (event && event.target && event.target.matches('.message')) {
            event.preventDefault();
            event.stopPropagation();
            alert("message event exists");

            var messageId = event.target.getAttribute('id');
            $(event.target).popover({
                placement: 'right',
                html: true,
                sanitize: false,
                title: 'Popover Title',
                content: `<form>
              <button type="button" class="btn btn-danger delete-button" id="${messageId}" onclick="chatApp.deletemessage('${this.getChatId()}', '${messageId}')">Delete</button>
            </form>`
            });
            $(event.target).popover('show');
        }
    }

    async findUsers() {
        // Your existing code here
        $('#searchuser').popover('dispose')

        $('.popover').remove();

        console.log("We start");

        let searchQuery = this.searchUser.value;
        if (searchQuery) {
            console.log("seaarc string = " + searchQuery)
            const endpoint = '/dashboard/searchUsers';
            const params = { searchQuery: searchQuery };
            let users;
            try {
                users = await this.getRequest(endpoint, params);
                // Create a single HTML string for all users
                let allUsersHtml = users.map(user => `
                    <div class="clearfix" onclick="chatApp.getConversation('${btoa(JSON.stringify(user))}')">
                            <div class="about" id="${user._id}" name="${user._id}">
                              <div class="name">${user.displayName}</div>                                           
                            </div>
                          </div>
                        `).join('');


                $(this.searchUser).popover({ // Use 'self' instead of 'this'
                    placement: 'bottom',
                    html: true,
                    sanitize: false,
                    title: 'search results',
                    content: allUsersHtml
                });
                $(this.searchUser).popover('show'); // Use 'self' instead of 'this'
            } catch (error) {
                console.error('An error occurred while fetching data:', error);
            }


        }
    }

    async getRequest(endpoint, params) {
        // Your existing code here
        try {
            const response = await this.apiClient.get(endpoint, { params: params });
            if (response && response.data) {
                console.log("response: " + response.data);
                return response.data;
            } else {
                console.error('Response or response.data is undefined for params : '+ JSON.stringify(params) );
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async postRequest(endpoint, data) {
        // Your existing code here
        try {
            const response = await this.apiClient.post(endpoint, data);
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteRequest(endpoint, data) {
        // Your existing code here
        try {
            const response = await this.apiClient.delete(endpoint, { data: data });
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    setChatName(user) {
        // Your existing code here
        this.roomName.innerHTML = user._id;
        this.chatWith.innerHTML = user.displayName;
    }





    getChatId() {
        // Generate chat ID
        const sendto = this.roomName.innerText;
        const sendfrom = this.profileId.innerText;
        if (!sendfrom.toString() || !sendto.toString()) {
            console.log('Either sendfrom or sendto is empty or null');
        } else {
            console.log('Both sendfrom and sendto are not empty and not null');
            return [sendfrom.toString(), sendto.toString()].sort().join('_');
        }
    }

    async getConversation(objStr) {
        // Send API request
        const user = JSON.parse(atob(objStr));
        const endpoint = '/dashboard/getMessages';
        const id = user._id;
        const params = { id: id };
        let response;
        try {
            response = await this.getRequest(endpoint, params);
        } catch (error) {
            console.error('An error occurred while fetching data:', error);
        }
        this.searchUser.value = '';
        this.setChatName(user);
        const currentRoom = this.getChatId();
        this.socket.emit('join', currentRoom);
        this.chatMessages.innerHTML = '';

        if (response !== null) {
            response.messages.forEach(item => {
                this.outputMessage(item);
            });
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            document.getElementById("unread_"+id).innerHTML= 0;
            document.getElementById("unread_"+id).setAttribute("hidden","");
            
        }
        
    }

    async deletemessage(conversationId = null, messageId = null) {
        // Delete message
        $('.popover').remove();
        let response;
        if (messageId !== null && messageId !== undefined && conversationId !== undefined && conversationId !== undefined) {
            const endpoint = '/dashboard/deleteMessageForOne';
            const data = { messageId: messageId, id: this.roomName.innerText };
            try {
                response = await this.deleteRequest(endpoint, data);
            } catch (error) {
                console.error('An error occurred while fetching data:', error);
            }
            this.socket.emit('deleteMessage', conversationId, messageId);
        };
    }

    async deleteconversation() {
        // Delete conversation
        console.log("delete conversation");
        $('.popover').remove();
        let response;
        console.log("roomname : " + this.roomName.innerText);
        const endpoint = '/dashboard/deleteConversationForOne';
        const data = { id: this.roomName.innerText };
        try {
            response = await this.deleteRequest(endpoint, data);
        } catch (error) {
            console.error('An error occurred while fetching data:', error);
        }
    }

    async sendMessage(e) {
        // Send message
        e.preventDefault();
        const message = e.target.elements.msg.value;
        if (message.trim() === "" || message === null || message === undefined){
            return
        }
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
        const chatId = this.getChatId();
        const Id = this.roomName.innerText;
        let response;
        const endpoint = '/dashboard/sendMessage';
        const data = { content: message, receiverId: Id };
        try {
            response = await this.postRequest(endpoint, data);
        } catch (error) {
            console.error('An error occurred while fetching data:', error);
        }
        this.socket.emit('chatMessage', chatId, response.message);
    }

    outputMessage(conv) {
        let room_name = this.roomName.innerHTML;
        if (conv !== undefined && conv !== null){
            let convSender = conv.sender;
            let convMessage = conv.content;
            let details = `
              <div class="clearfix m-b-0">
                  <div class="message-data ${(convSender !== room_name) ? 'text-right' : ' '}">
                      <span class="message-data-time">10:10 AM, Today</span>
                      <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
                  </div>
                  <div class="message other-message ${(convSender !== room_name) ? 'float-right' : ' '}" id="${conv._id}"> ${(typeof conv === 'string')? conv : convMessage} </div>
              </div>
              `;
              this.chatMessages.insertAdjacentHTML('beforeend', details);
        }
    }



     // Get room and users
}
const chatApp = new ChatApp();
document.addEventListener('DOMContentLoaded', () => chatApp.initialize());

// module.exports = {ChatApp};
