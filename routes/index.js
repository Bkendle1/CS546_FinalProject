import userRoutes from './user.js';
// import all the other routes ...


const configRouteFunction = (app) => {
  app.use('/', userRoutes);

//   app.use('*', (req, res) => {
  app.use(/(.*)/, (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default configRouteFunction;



