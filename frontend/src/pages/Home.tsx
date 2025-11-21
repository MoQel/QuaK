import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { FolderOpen, Users } from 'lucide-react';



export const Home: React.FC = () => {
  // Mock data - in the future load from API or Context
  const ownProjects: string[] = [
    "Quantum Teleportation",
    "Shor's Algorithm",
    "Grover's Search",
    "Quantum Error Correction",
    "Bell State Preparation",
    "Quantum Fourier Transform",
    "VQE Implementation"
  ];

  const invitedProjects: string[] = [
    "Collaborative QKD",
    "Quantum ML Research",
    "Entanglement Study",
    "Quantum Cryptography",
    "Superdense Coding"
  ];

  const ProjectCard: React.FC<{ name: string }> = ({ name }) => (
    <Card className="min-w-[16rem] flex-shrink-0 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="font-medium text-lg flex-1">{name}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Last modified: 2 days ago
          </div >
          <div className="mt-2">
            <Link to="/project">
              <Button className="w-full" variant="default">Open Project</Button>
            </Link>
          </div>
        </div >
      </CardContent >
    </Card>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-9">
        <h1 className="text-4xl font-bold mb-5 bg-gradient-to-r from-white to-white bg-clip-text text-transparent leading-tight py-1">
          Projects
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome to your quantum computing workspace. View and manage all your projects.
        </p>
      </div>

      <div className="space-y-6">
        {/* Own Projects Section */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-left">Own Projects</CardTitle>
                <CardDescription className="text-left">Projects you created and own</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ownProjects.length > 0 ? (
              <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex flex-row gap-4">
                  {ownProjects.map((p, index) => (
                    <ProjectCard key={`${p}-${index}`} name={p} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">You have no projects yet.</p>
                <Button className="mt-4" variant="outline">Create New Project</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invited Projects Section */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-left">Invited Projects</CardTitle>
                <CardDescription className="text-left">Projects shared with you by collaborators</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {invitedProjects.length > 0 ? (
              <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex flex-row gap-4">
                  {invitedProjects.map((p, index) => (
                    <ProjectCard key={`${p}-${index}`} name={p} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">You have no invited projects.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

export default Home;
