import ampq from 'amqplib';

const ProducerService = {
    async sendMessage(queue, message){
        const connection = await ampq.connect(process.env.RABBITMQ_SERVER);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        setTimeout(() => {
            connection.close();
        }, 500);
    }
};

export default ProducerService;