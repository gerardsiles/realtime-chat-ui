import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type Message = {
	message: string;
	id: string;
	createdAt: string;
	port: string;
};

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://127.0.0.1';
const CONNECTION_COUNT_UPDATED_CHANNEL = 'chat:connection-count-updated';
const NEW_MESSAGE_CHANNEL = 'chat:new-message';

function useSocket() {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const socketIo = io(SOCKET_URL, {
			reconnection: true,
			upgrade: true,
			transports: ['websocket', 'polling'],
		});

		setSocket(socketIo);

		return function () {
			socketIo.disconnect();
		};
	}, []);

	return socket;
}

export default function Home() {
	const messageListRef = useRef<HTMLOListElement | null>(null);
	const socket = useSocket();
	const [connectionCount, setConnectionCount] = useState<number>(0);
	const [newMessage, setNewMessage] = useState<string>('');
	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		socket?.on('connect', () => {
			console.log('connected');
		});
		socket?.on(NEW_MESSAGE_CHANNEL, (message: Message) => {
			setMessages(prevMessages => [...prevMessages, message]);
			setTimeout(() => {
				scrollOnMessage();
			}, 0);
		});
		socket?.on(
			CONNECTION_COUNT_UPDATED_CHANNEL,
			({ count }: { count: number }) => {
				setConnectionCount(count);
			}
		);
	}, [socket]);

	const scrollOnMessage = () => {
		if (messageListRef.current) {
			messageListRef.current.scrollTop =
				messageListRef.current.scrollHeight + 1000;
		}
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setNewMessage('');
		socket?.emit(NEW_MESSAGE_CHANNEL, { message: newMessage });
	};

	return (
		<main className='flex flex-col p-4 w-full max-w-3xl m-auto'>
			<h1 className='text-4xl font-bold text-center mb-4'>
				Chat ({connectionCount})
			</h1>
			<ol
				className='flex-1 overflow-y-scroll overflow-x-hidden mb-4'
				ref={messageListRef}
			>
				{messages.map(message => (
					<li
						key={message.id}
						className='flex flex-col bg-gray-100 rounded-lg p-4 my-2 break-all mx-1'
					>
						<p className='text-gray-500 text-sm mb-2'>{message.createdAt}</p>
						<p className='text-gray-500 text-sm mb-2'>{message.port}</p>
						{message.message}
					</li>
				))}
			</ol>
			<form onSubmit={handleSubmit} className='flex items-center'>
				<Textarea
					className='rounded-lg mr-4'
					placeholder='Type your message here...'
					value={newMessage}
					onChange={e => setNewMessage(e.target.value)}
					maxLength={255}
				/>
				<Button className='h-full'>Send Message</Button>
			</form>
		</main>
	);
}
