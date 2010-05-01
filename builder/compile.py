#!/usr/local/bin/python
import glob
import sys
import getopt
import os
import os.path
import subprocess

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

class Config:
	def __init__(self,filename):
		self.path=filename

		fileobject=open(self.path,"r")

		self.sections=dict()

		sectioncontext=None
		filecontext=None
		for line in fileobject:
			line=line.strip()
			if line.endswith(':'):
				sectioncontext=dict()
				sectioncontext["files"]=dict()
				sectioncontext["args"]=[]
				self.sections[line[:-1]]=sectioncontext
				filecontext=None

			elif line.startswith('@'):
				filecontext=[]
				sectioncontext["files"][line[1:]]=filecontext

			elif line.startswith('-'):
				parts=line[1:].split(None,1)
				property=parts[0]
				value=None
				if len(parts)>1:
					value=parts[1]
				else:
					value=property
				#print("setting %s = %s"%(property,value,))
				if not filecontext is None:
					filecontext[property]=value
				if property=="arg":
					if not "args" in sectioncontext:
						sectioncontext["args"]=[]
					sectioncontext["args"].extend(value.split())
				if property=="path":
					sectioncontext["path"]=os.path.abspath(os.path.join(os.path.dirname(self.path),value))
				else:
					sectioncontext[property]=value

			elif len(line) > 0 and not line.startswith('#'):
				filecontext.append(line)


def compile(config,args=None):
	config=Config(config)
	dir=os.path.dirname(config.path)
	for section in config.sections:
		section=config.sections[section]
		files=section["files"]
		for output_file in files:
			input_files=files[output_file]
			print bcolors.OKGREEN + "Writing "+output_file + bcolors.ENDC
			file_type_index=output_file.rfind(".")
			target=os.path.abspath(os.path.join(dir,output_file[:file_type_index]+output_file[file_type_index:]))
			outfname=os.path.abspath(os.path.join(dir,output_file[:file_type_index]+".uncompressed"+output_file[file_type_index:]))
			#print("dir: %s : %s = %s"%(os.path.dirname(config.path),output_file[:file_type_index]+".uncompressed"+output_file[file_type_index:],outfname,))
			outf=open(outfname,"w+")
			outf.write("//"+output_file+"\n")
			for input_file in input_files:
				path=section["path"]
				expansion=glob.iglob(os.path.join(path,input_file))
				for file in expansion:
					if file==target or file==outfname:
						continue
					else:
						print("Concatting "+bcolors.HEADER+file+bcolors.ENDC)
						outf.write("\n//@"+file+"\n"+open(file).read())
				outf.flush()
			outf.write("\n")
			outf.close()
			cmd=[
				"java"
				,"-jar"
				,os.environ["JS_COMPRESSOR"]
			]
			cmd.extend(section["args"])
			cmd.extend([
				os.path.abspath(
					os.path.join(
						os.curdir
						,os.path.dirname(config.path)
						,outfname
					)
				)
			])
			compressor=subprocess.Popen(cmd,stdout=subprocess.PIPE)
			outfname=target
			output_file=open(outfname,"w+")
			print(bcolors.OKBLUE+"Compressing"+bcolors.ENDC)
			while compressor.returncode is None:
				data,err=compressor.communicate()
				if not err is None:
					print(err)
				elif not data is None:
					output_file.write(data)
			output_file.close()
			if not section["keep-uncompressed"]:
				os.remove(outfname)

class Usage(Exception):
	def __init__(self, msg):
		self.msg = msg

def main(argv=None):
	if argv is None:
		argv = sys.argv
	try:
		try:
			opts, args = getopt.getopt(argv[1:], "h", ["help"])
		except getopt.error, msg:
			raise Usage(msg)
	# more code, unchanged
	except Usage, err:
		print >>sys.stderr, err.msg
		print >>sys.stderr, "for help use --help"
		return 2

	compile(os.path.join(os.path.dirname( __file__ ),"compile-list.config"))

if __name__ == "__main__":
	sys.exit(main())