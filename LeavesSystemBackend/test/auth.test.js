const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); // make sure `server.js` exports the app
const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth Routes', () => {
  it('should return validation error for missing fields during login', (done) => {
    chai.request(app)
      .post('/api/auth/login')
      .send({}) // no idno or password
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Validation error');
        done();
      });
  });

  it('should return user not found for wrong ID number', (done) => {
    chai.request(app)
      .post('/api/auth/login')
      .send({ idno: '00000000', password: 'WrongPass!2024' })
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.message).to.include('User not found');
        done();
      });
  });

  // You can add more tests for setPassword, valid login, etc.
});
