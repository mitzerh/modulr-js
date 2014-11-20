module.exports = function(grunt) {

    var conf = grunt.file.readJSON('package.json');

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
                dest: 'src/modulr.js.tmp',
                options: {
                    process: function (content, srcpath) {
                        
                        content = content.replace('${version}', conf.version);

                        content = content.replace('\/\/inclue:${domready}', (function(){
                            var ret = grunt.file.read(__dirname + '/src/domready.tmp');
                            return ret;
                        }()));

                        content = [comment, content].join('\n\n');

                        return content;

                    }

                }

            }
            
        },

        concat: {

            dist: {
                
                files: {
                    //'js/startup.js': ['src/startup.js.tmp', 'src/domready.js']
                    'js/modulr.js': ['src/modulr.js.tmp']
                }
                

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

            domready: {

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
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask('default', ['clean:dest', 'uglify:domready', 'jshint', 'copy:dist', 'concat', 'clean:temp', 'uglify:dist']);

    grunt.initConfig(config);

};