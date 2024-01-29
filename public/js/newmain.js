

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-history');
const roomName = document.getElementById('room-name');
const chatWith = document.getElementById('chat-with');
const userList = document.getElementById('users');
const profileId = document.getElementById('profile-id');
const profileName = document.getElementById('profile-displayName');
const searchUser = document.querySelector('#searchuser');

const io = require('socket.io-client');
const axios = require('axios');
const socket = io();

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // replace with your API base URL
  withCredentials: true, 
});

document.body.addEventListener('click', function (event) {

    $('.popover').remove();
  });


  searchUser.addEventListener('keyup', findUsers);
  chatMessages.addEventListener('mouseup', messageOptions);
  chatForm.addEventListener('submit', sendMessage);

  function messageOptions(event) {
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
        <button type="button" class="btn btn-danger delete-button" id="${messageId}" onclick="deletemessage('${getChatId()}', '${messageId}')">Delete</button>
      </form>`
      });
      $(event.target).popover('show');
    }
  };
  


 function findUsers() {
  // $('#searchuser').popover('hide')
  $('#searchuser').popover('dispose')

  $('.popover').remove();

  console.log("We start");

  let searchQuery = this.value;
  if (searchQuery) {
    const email = searchQuery;
    const self = this; // Assign 'this' to 'self'

    // Send API request
    axios.get('http://localhost:3000/dashboard/searchUsers', { params: { email } })
      .then(function (response) {

        console.log(response.data);
        const users = response.data;
        console.log("We got a response");

        // Create a single HTML string for all users
        let allUsersHtml = users.map(user => `
rsation      <div class="clearfix" onclick="getConversation('${btoa(JSON.stringify(user))}')">
        <div class="about" id="${user._id}" name="${user._id}">
          <div class="name">${user.displayName}</div>                                           
        </div>
      </div>
    `).join('');


        $(self).popover({ // Use 'self' instead of 'this'
          placement: 'bottom',
          html: true,
          sanitize: false,
          title: 'search results',
          content: allUsersHtml
        });
        $(self).popover('show'); // Use 'self' instead of 'this'
      })
      .catch(function (error) {
        console.error(error);
      });
  }
};
async function getRequest(endpoint, params) {
    try {
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async function postRequest(endpoint, data) {
    try {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function deleteRequest(endpoint, data) {
    try {
      // const response = await apiClient.delete(`${endpoint}?id=${data.id}`);
      const response = await apiClient.delete(endpoint, { data: data });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  function setChatName(user) {
    roomName.innerHTML = user._id;
    chatWith.innerHTML = user.displayName;
  };
  
  function getChatId() {
    const sendto = roomName.innerText;
    const sendfrom = profileId.innerText;
    if (!sendfrom.toString() || !sendto.toString()) {
      console.log('Either sendfrom or sendto is empty or null');
    } else {
      console.log('Both sendfrom and sendto are not empty and not null');
      return [sendfrom.toString(), sendto.toString()].sort().join('_');
    }
  }
  

  async function getConversation(objStr) {
    const user = JSON.parse(atob(objStr));
    const endpoint = '/dashboard/getMessages';
    id = user._id
    const params = { id: id };
    let response;
    try{
     response = await getRequest(endpoint, params);
    }catch(error){
      console.error('An error occurred while fetching data:', error);
    }
    searchUser.value = '';
    setChatName(user);
    const currentRoom = getChatId();
    socket.emit('join', currentRoom);
    chatMessages.innerHTML = '';
  
    if (response !== null) {
      response.messages.forEach(item => {
        outputMessage(item);
      });
  
      var childElement = document.getElementById(id);
  
      // If the child element is found
      if (childElement) {
        console.log('Element found');
  
        // Find the element with class "unread" within the child element
        const unreadElements = childElement.querySelector('.unread');
  
        unreadElements.innerHTML = 0;
  
      } else {
        console.log('Element not found');
      }
    }
  }
  

  
async function deletemessage( conversationId=null, messageId=null) {
    $('.popover').remove();
    let response;
    if (messageId !== null && messageId !== undefined && conversationId !== undefined && conversationId !== undefined) {
        const endpoint = '/dashboard/deleteMessage';
        const data = { messageId: messageId, id: roomName.innerText };
      try{
         response = await deleteRequest(endpoint, data)
      }catch(error){
        console.error('An error occurred while fetching data:', error);
      }
        socket.emit('deleteMessage', conversationId, messageId);
        console.log("messageid is set.");

      };
     };
     
async function deleteconversation(){
        console.log("delete conversation")
        $('.popover').remove();
        let response; 
        console.log("roomname : "+ roomName.innerText)       
        const endpoint = '/dashboard/deleteConversation';
        const data = { id: roomName.innerText };
        try{
           response = await deleteRequest(endpoint, data);
        }catch(error){
          console.error('An error occurred while fetching data:', error);
        }
        console.log("message ID is not set,deleting conv.");
  
  };


 async function sendMessage(e) {
    e.preventDefault();
    const message = e.target.elements.msg.value;
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  
    // Get chat ID and room name
    const chatId = getChatId();
    const Id = roomName.innerText;
    let response;
    const endpoint = '/dashboard/sendMessage';
    const data = { content: message , receiverId: Id };
    try{
      response = await postRequest(endpoint, data)
    }catch(error){
      console.error('An error occurred while fetching data:', error);
    }
    socket.emit('chatMessage', chatId, response.message);
    // Send message to server
    sendMessageToServer(message, Id, chatId);
  };
  
  // Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
  });
  
  //message from server
  socket.on('message', (roomname, msg, senderId) => {
    if (roomname === getChatId()) {
      console.log('message sent: ' + msg)
      outputMessage(msg);
    } else {
      // Get the child element with the specific id
      var childElement = document.getElementById(senderId);
  
      // If the child element is found
      if (childElement) {
        console.log('Element found');
  
        // Find the element with class "unread" within the child element
        const unreadElements = childElement.querySelector('.unread');
  
        unreadElements.innerHTML = parseInt(unreadElements.innerHTML) + 1;
  
        parentElement = document.getElementsByClassName(".chat-list");
  
        parentElement.insertBefore(childElement.closest("clearfix"), parentElement.firstChild);
  
  
      } else {
        console.log('Element not found');
      }
  
    }
  
    //scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  
  
  
socket.on("deletemessage", (roomname, msg) => {
    if (roomname === getChatId()) {
      let element = document.getElementById(msg);
      if (element) {
        let parent = element.closest('.clearfix');
        if (parent) {
          parent.parentNode.removeChild(parent);
        }
      }
      console.log("trying to delete response");  // Log the response
  
  
    }
  });


  
function outputMessage(conv) {

    let room_name = roomName.innerHTML;
    //console.log("roomname1"+room_name)
  
    let ul = document.querySelector('.chat-history');
    if (typeof conv === 'string') {
  
      let details = `
      <div class="clearfix">
          <div class="message-data ${conv !== room_name ? 'text-right' : ''}">
              <span class="message-data-time">10:10 AM, Today</span>
              <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
          </div>
          <div class="message other-message ${conv !== room_name ? 'float-right' : ''}"> ${conv} </div>
      </div>
      `;
      ul.insertAdjacentHTML('beforeend', details);
      // ul.style.overflow = 'auto';
    } else {
      let convSender = conv.sender;
      let convMessage = conv.content;
      console.log("convSender " + convSender)
      console.log("roomname2 " + room_name)
      // <ul class="m-b-0
      let details = `
        <div class="clearfix m-b-0">
            <div class="message-data ${(convSender !== room_name) ? 'text-right' : ' '}">
                <span class="message-data-time">10:10 AM, Today</span>
                <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
            </div>
            <div class="message other-message ${(convSender !== room_name) ? 'float-right' : ' '}" id="${conv._id}"> ${convMessage} </div>
        </div>
        `;
      ul.insertAdjacentHTML('beforeend', details);
      // ul.innerHTML += details
      // ul.style.overflow = 'auto';
  
    }
  
  
  
  
  }

  
//   try {
//     const data = await getRequest('http://example.com/api', { param1: 'value1', param2: 'value2' });
//     console.log(data);
//   } catch (error) {
//     console.error('An error occurred while fetching data:', error);
//   }

module.exports = { messageOptions, findUsers, getRequest, postRequest, deleteRequest };