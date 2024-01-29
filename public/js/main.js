const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-history');
const roomName = document.getElementById('room-name');
const chatWith = document.getElementById('chat-with');
const userList = document.getElementById('users');
const profileId = document.getElementById('profile-id');
const profileName = document.getElementById('profile-displayName');
const searchUser = document.querySelector('#searchuser');

const socket = io();

document.body.addEventListener('click', function (event) {

  $('.popover').remove();
});




searchUser.addEventListener('keyup', findUsers);

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
      <div class="clearfix" onclick="getConversation('${btoa(JSON.stringify(user))}')">
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

chatMessages.addEventListener('mouseup',messageOptions);
 function messageOptions(event) {
  if (event.target.matches('.message')) {
    event.preventDefault();

    var messageId = event.target.getAttribute('id');
    //console.log("mid "+messageId)
    ;
    $(event.target).popover({
      placement: 'right',
      html: true,
      sanitize: false,
      title: 'Popover Title',
      content: `<form>
      <button type="button" class="btn btn-danger delete-button" id="${messageId}" onclick="delMessages('${messageId}')">Delete</button>
    </form>
    
                  `
    });
    $(event.target).popover('show');
  }
};

//==================================================================
function getConversation(objStr) {
  const user = JSON.parse(atob(objStr));
  console.log('getConversation function received user:', user);
  console.log('getConversation function is called with id:', user._id);
  console.log('getConversation function is called for user: ', user.displayName);
  // Replace with your API endpoint
  const url = 'http://localhost:3000/dashboard/getMessages';
  id = user._id
  // Replace with the data you want to send
  const data = { id };


  axios.get(url, { params: data })
    .then(response => {

      searchUser.value = '';
      setChatName(user);
      let currentRoom = getChatId();
      socket.emit('join', currentRoom);

      console.log("response received");
      document.querySelector('.chat-history').innerHTML = '';

      if (response.data !== null) {
        response.data.messages.forEach(item => {
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

    })
    .catch(error => {
      console.error(error);
    });


  document.querySelector('.chat-history').scrollTop = document.querySelector('.chat-history').scrollHeight;

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






function deleteconversation() {

  const url = 'http://localhost:3000/dashboard/deleteConversation';

  const id = roomName.innerText;
  const data = { id: id };
  axios({
    url: url,
    method: "delete",
    data: data,
    withCredentials: true
  }).then(function (response) {
    console.log("delete response");  // Log the response
    // socket.emit('deleteMessage', getChatId() ,messid);
    console.log("delete sent ");  // Log the response




  })
    .catch(function (error) {
      console.log(error);  // Log any errors
    });
};

socket.on("deletemessage", (roomname, msg) => {
  if (roomname === getChatId()) {
    let element = document.getElementById(msg);
    if (element) {
      let messageParent = element.closest('.clearfix');
      if (parent) {
        messageParent.parentNode.removeChild(messageParent);
      }
    }
    console.log("trying to delete response");  // Log the response


  }
});
function delMessages(messid) {

  $('.popover').remove();

  const url = 'http://localhost:3000/dashboard/deleteMessage';
  const id = roomName.innerText;
  const data = { messageId: messid, id: id };
  axios({
    url: url,
    method: "delete",
    data: data,
    withCredentials: true
  }).then(function (response) {
    console.log("delete response");  // Log the response
    socket.emit('deleteMessage', getChatId(), messid);
    console.log("delete sent ");  // Log the response




  })
    .catch(function (error) {
      console.log(error);  // Log any errors
    });
};


//submit message
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // get message
  const msg = e.target.elements.msg.value;


  const chatId = getChatId();
  const Id = roomName.innerText;

  console.log('emittung: ' + msg);

  //send message to server
  const url = 'http://localhost:3000/dashboard/sendMessage';

  // Replace with the data you want to send
  const data = { content: msg, receiverId: Id };
  axios({
    url: url,
    method: "POST",
    data: data,
    withCredentials: true
  }).then(response => {

    console.log(response.message)
    console.log(response.data.message)
    socket.emit('chatMessage', chatId, response.data.message);

  })
    .catch(error => {
      console.error(error);
    });


  //clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
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

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

// // Export the functions
// module.exports = {
//   setChatName,
//   getConversation,
//   getChatId,
//   deleteconversation,
//   delMessages,
//   outputMessage,
//   outputRoomName,
//   outputUsers
// };
