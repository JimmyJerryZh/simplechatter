import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import Popper from 'popper.js';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import socketIOClient from 'socket.io-client';
import Cookies from 'universal-cookie';

const endpoint = 'localhost:3000';
const socket = socketIOClient(endpoint);
const cookies = new Cookies();
class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            users: [],
            name: '',
            color: ''
        };
        this.getName = this.getName.bind(this);
        this.receiveUser = this.receiveUser.bind(this);
        this.receiveMessageList = this.receiveMessageList.bind(this);
        this.receiveMessage = this.receiveMessage.bind(this);
        this.getName = this.getName.bind(this);
    }

    componentDidMount() {
        console.log(cookies.getAll());
        var mycookie = cookies.get('name');
        console.log(mycookie);
        var reconnect = false;
        if (typeof mycookie !== 'undefined') {
            console.log('look here');
            console.log(mycookie);
            console.log(mycookie.name);
            console.log(mycookie.color);
            this.setState({ name: mycookie.name, color: mycookie.color });
            reconnect = true;
        }
        // if (reconnect) {
        //     socket.emit('reconnecting');
        //     console.log('what is going on here');
        // } else {
        //     socket.emit('firstConnect');
        // }
        socket.emit('firstConnect', mycookie);
        socket.on('getName', this.getName);
        socket.on('receiveUser', this.receiveUser);
        socket.on('receiveMessageList', this.receiveMessageList);
        socket.on('receiveMessage', this.receiveMessage);
    }
    componentWillUnmount() {
        socket.emit('disconnect', { name: this.state.name });
    }

    receiveUser(userList) {
        console.log('receiving list of names from server');
        console.log(userList);
        this.setState({ users: userList });
    }

    receiveMessageList(msgList) {
        console.log('receiving all messages from server');
        console.log(msgList);
        var name = this.state.name;
        msgList.forEach(function(message) {
            if (message.user === name) {
                message.currentuser = true;
            } else {
                message.currentuser = false;
            }
        });
        this.setState({ messages: msgList });
    }

    getName(usr) {
        console.log('receiving name from server');
        console.log(usr);
        this.setState({ name: usr.name, color: usr.color });
        cookies.set('name', { name: usr.name, color: usr.color }, { path: '/' });
        console.log(cookies.getAll());
    }

    receiveMessage(msg) {
        console.log('im working');
        console.log(msg);
        if (msg.user === this.state.name) {
            msg.currentuser = true;
        } else {
            msg.currentuser = false;
        }
        var newMessages = this.state.messages;
        newMessages.push(msg);
        this.setState({ messages: newMessages });
    }

    handleNewMessage = (msg) => {
        var input = msg.text;
        var name = this.state.name;
        socket.on('getName', this.getName);
        msg.user = this.state.name;
        msg.color = this.state.color;
        console.log(input.indexOf('/nick '));
        console.log(input.substr(6));

        if (input.indexOf('/nickColor ') === 0) {
            socket.emit('colorChange', { name: name, newColor: '#' + input.substr(11) });
        } else if (input.indexOf('/nick ') === 0) {
            socket.emit('nameChange', { name: name, newName: input.substr(6), color: this.state.color });
        } else {
            socket.emit('sentMessage', msg);
        }
    };

    render() {
        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-xs-4"> </div>
                    <div class="col supreme"> {'SIMPLE CHAT'}</div>
                    <div class="col-xs-7"> </div>
                </div>
                <div class="row">
                    <div class="col"> </div>
                    <div class="col-11" style={{ color: this.state.color }}>
                        {' '}
                        {'Hello ' + this.state.name}
                    </div>
                    <div class="w-100" />
                    <div class="col" />
                    <div class="col-7 col-border">
                        <MessageList messages={this.state.messages} users={this.state.users} />
                    </div>
                    <div class="col-4 user-border">
                        <UserList users={this.state.users} />
                    </div>
                </div>
                <div class="row">
                    <div class="col" />
                    <div class="col-11 row-no-padding">
                        <MessageForm onMessageSend={this.handleNewMessage} />
                    </div>
                </div>
            </div>
        );
    }
}

class Message extends React.Component {
    render() {
        const classes = classNames('Message', {
            notMe: !this.props.currentuser,
            isMe: this.props.currentuser
        });

        return (
            <div>
                <div className={classes} style={{ color: this.props.color }}>
                    {' '}
                    {this.props.user}
                </div>
                <div className={classes}>
                    {this.props.time}
                    {'  '}
                    {'  '}
                    {this.props.text}
                </div>
            </div>
        );
    }
}

class MessageForm extends React.Component {
    static propTypes = {
        onMessageSend: PropTypes.func.isRequired
    };

    componentDidMount = () => {
        this.input.focus();
    };

    handleFormSubmit = (event) => {
        event.preventDefault();

        var message = {
            type: 'message',
            text: this.input.value,
            time: 0,
            user: 0,
            currentuser: true,
            color: ''
        };
        this.props.onMessageSend(message);
        this.input.value = '';
    };

    render() {
        return (
            <form onSubmit={this.handleFormSubmit}>
                <div class="input-group">
                    <input
                        className="MessageForm test"
                        type="text"
                        ref={(node) => (this.input = node)}
                        placeholder="Type your message here!"
                    />

                    <div class="input-group-append">
                        <button type="submit" className="btn btn-primary">
                            Send!
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

class MessageList extends React.Component {
    //https: //stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
    messagesEnd = React.createRef();

    componentDidMount() {
        this.scrollToBottom();
    }
    componentDidUpdate() {
        this.scrollToBottom();
    }
    scrollToBottom = () => {
        this.messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
    };

    //https://www.twilio.com/blog/2017/10/chat-interfaces-react-javascript.html
    //how to get input data and render a list using map
    render() {
        const listItems = this.props.messages.map((message, i) => {
            return (
                <Message
                    key={i}
                    text={message.text}
                    time={message.time}
                    currentuser={message.currentuser}
                    user={message.user}
                    color={message.color}
                />
            );
        });

        return (
            <div>
                <div>{listItems}</div>
                <div ref={this.messagesEnd} />
            </div>
        );
    }
}

class UserList extends React.Component {
    render() {
        const listItems = this.props.users.map((user, i) => {
            return <User key={i} name={user.name} color={user.color} />;
        });

        return <div>{listItems}</div>;
    }
}

class User extends React.Component {
    render() {
        const classes = classNames('Users', {
            notMe: !this.props.currentuser,
            isMe: this.props.currentuser
        });

        return (
            <div>
                <div className={classes} style={{ color: this.props.color }}>
                    {' '}
                    {this.props.name}{' '}
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
