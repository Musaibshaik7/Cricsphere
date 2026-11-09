FROM gcc:13

WORKDIR /app
COPY . .
RUN g++ -std=c++17 server.cpp -o server -pthread

EXPOSE 8080
CMD ["./server"]
