# Modul R

A web browser Javascript code dependency management, loosely based on [AMD JS API Specifications](https://github.com/amdjs/amdjs-api/wiki/AMD).

Please see [Wiki](https://github.com/mitzerh/ModulR/wiki) for detailed documentation.

**Latest Stabe/Release version `v1.2.5`:** [`modulr.js`](https://raw.githubusercontent.com/mitzerh/modulr-js/master/js/modulr.js) | [`modulr.min.js`](https://raw.githubusercontent.com/mitzerh/modulr-js/master/js/modulr.min.js) | [Release Notes](https://github.com/mitzerh/modulr-js/wiki/Release-Notes)


**Modul R** introduces the concept of packaged instances. Packaged instances are independent, but can communicate with other packages. Modules/instances don't need to be on the same aggregated/optimized files. Applications, especially large-scale implementations that requires to split application architecture in multiple files, can benefit from this.


## Quick Demo

Run the simple demo, to view on your localhost

```bash
# run @ default port 9999
npm run demo

# custom port:
npm run demo 9898

```

Local host: [http://localhost:[PORT_NUMBER]/](http://localhost:[PORT_NUMBER]/)
