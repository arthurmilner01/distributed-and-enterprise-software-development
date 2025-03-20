FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

#TODO: Get this to work. NPM install doesnt work. have to manually install packages
#IMPORTANT --> Have to run npm install for all packages inside of docker frontend shell manually
RUN npm install 
RUN npm install bootstrap react-bootstrap react-bootstrap-typeahead react-router-dom axios @popperjs/core jwt-decode lucide-react

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]