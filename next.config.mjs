const basePath=process.env.PAGES_BASE_PATH??'';
if(basePath&&!/^\/[A-Za-z0-9_.-]+$/.test(basePath))throw new Error('Invalid PAGES_BASE_PATH');
export default {output:'export',basePath,env:{NEXT_PUBLIC_BASE_PATH:basePath},trailingSlash:true,images:{unoptimized:true},poweredByHeader:false};
