# Exoplanets Review

## _On average, it is estimated that there is at least one planet for every star in the galaxy. That means there's something on the order of billions of planets in our galaxy alone, many in Earth's size range. These planets outside of our solar system are known as Exoplanets..._

This website is a collection of the 227 confirmed planets by the [TESS Survey Satellite](https://en.wikipedia.org/wiki/Transiting_Exoplanet_Survey_Satellite). 

You can browse the planets and leave a review with your thoughts on it, Data was extracted from the [NASA's Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=PS&constraint=default_flag=1&constraint=disc_facility+like+%27%25TESS%25%27) website. Additional data from [NASA's Open API](https://api.nasa.gov/) was used.

## Technologies
- [Vite](https://vitejs.dev/) as the build tool
- [React](https://reactjs.org/) as the frontend lib
- [TailwindCSS](https://tailwindcss.com/) as styles
- [Flowbite](https://flowbite.com/) as the component library
- [Firebase](https://en.wikipedia.org/wiki/Firebase) as the backend

## Installing

To run the program locally, download the repo and run:
```
npm install --legacy-peer-deps
```

**The firebase-react dependency is stuck on an old version of react thus the `--legacy-peer-deps` flag is needed.**

Then to start a server locally, you can run:
```
npm run dev
```
