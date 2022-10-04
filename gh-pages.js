const ghpages = require('gh-pages')

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/vt1022/portfolio-2022.git', // Update to point to your repository
        user: {
            name: 'vt1022', // update to use your name
            email: 'vinccimantsui@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)
