module.exports = function(grunt) {

    var conf = grunt.file.readJSON('package.json'),
        demo = grunt.option("demo") || false;

    // comment banner
    var comment = [
        '/**',
        conf.name + ' v' + conf.version + ' | ' + grunt.template.today("yyyy-mm-dd"),
        conf.description,
        'by ' + conf.author,
        conf.license
    ].join('\n* ') + '\n**/';

    var config = {

        pkg: grunt.file.readJSON('package.json'),

        clean: {

            'dest': 'js/*',

            'temp': 'src/*.tmp'

        },

        copy: {

            dist: {

                src: 'src/modulr.js',
                dest: 'js/modulr.js',
                options: {
                    process: function (content, srcpath) {
                        content = content.replace('${version}', conf.version);
                        content = [comment, content].join('\n\n');
                        return content;
                    }

                }

            },

            demo: {

                src: 'js/modulr.js',
                dest: 'demo/js/modulr.js'

            }

        },

        concat: {

            demo: {
                options: {
                    separator: ';'
                },
                files: grunt.file.readJSON('demo/build.json')
            }

        },

        jshint: {

            build: {

                options: grunt.file.readJSON('.jshintrc'),
                expand: true,
                src: ['src/modulr.js']

            }

        },

        uglify: {

            dist: {

                options: {
                    mangle: true,
                    banner: comment + '\n'
                },
                files: {
                    'js/modulr.min.js' : 'js/modulr.js'
                }

            },

            includes: {

                option: {
                    mangle: true
                },
                files: {
                    'src/domready.tmp': 'src/domready.js'
                }

            }

        }

    };

    // load npm's
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    var tasks;

    if (demo) {
        tasks = [
            'concat:demo'
        ];
    } else {
        tasks = [
            'clean:dest',
            'uglify:includes',
            'jshint',
            'copy:dist',
            'copy:demo',
            'concat:demo',
            'uglify:dist',
            'clean:temp'
        ];
    }

    grunt.registerTask('default', tasks);

    grunt.initConfig(config);

};
