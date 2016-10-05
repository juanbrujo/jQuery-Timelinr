module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("jquery.timelinr.json"),
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *\n" +
				" *  <%= pkg.homepage %>\n" +
				" *  Demo: <%= pkg.demo %>\n" +
				" *\n" +
				" *  Author: <%= pkg.author.name %> |  <%= pkg.author.twitter %>\n" +
				" *  License: <%= pkg.licenses[0].type %>\n" +
				" *  <%= pkg.licenses[0].copyright %>\n" +
				" */\n"
		},
		concat: {
			options: {
				banner: "<%= meta.banner %>"
			},
			dist: {
				src: ["src/jquery.timelinr.js"],
				dest: "dist/jquery.timelinr.js"
			}
		},
		jshint: {
			files: ["src/jquery.timelinr.js"],
			options: {
				jshintrc: ".jshintrc"
			}
		},
		uglify: {
			options: {
				banner: "<%= meta.banner %>"
			},
			target: {
				src: ["dist/jquery.timelinr.js"],
				dest: "dist/jquery.timelinr.min.js"
			}
		},
		sass: {
			options: {
				banner: "<%= meta.banner %>",
				sourceMap: true
			},
			dist: {
				files: {
					'dist/jquery.timelinr.css': 'src/jquery.timelinr.scss'
				}
			}
		},
		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1,
				banner: "<%= meta.banner %>"
			},
			target: {
				files: [{
					expand: true,
					cwd: 'dist',
					src: ['*.css', '!*.min.css'],
					dest: 'dist',
					ext: '.timelinr.min.css'
				}]
			}
		},
		watch: {
			options: {
				livereload: true
			},
			scripts: {
				files: ['src/*.js'],
				tasks: ['concat'],
				options: {
					spawn: false
				}
			},
			css: {
				files: ['src/*.scss'],
				tasks: ['sass'],
			},
			html: {
				files: ['demo/*.html'],
			},
			tasks: ['default']
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-sass");
	grunt.loadNpmTasks("grunt-contrib-cssmin");

	grunt.registerTask("default", ["concat", "sass"]);
	grunt.registerTask("build", ["concat", "uglify", "sass", "cssmin"]);
	grunt.registerTask("testjs", ["jshint"]);

};
