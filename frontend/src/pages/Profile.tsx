import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export const Profile: React.FC = () => {
  // Mock profile data
  const [profileData] = useState({
    username: 'quantum_researcher',
    email: 'alice.quantum@example.com',
    fullName: 'Dr. Alice Quantum',
    bio: 'Quantum computing researcher specializing in quantum algorithms and error correction. Passionate about making quantum computing accessible to everyone.',
    institution: 'Quantum Research Institute',
    role: 'Senior Researcher',
    joinDate: 'January 2024',
    projectsCount: 12,
    collaborations: 5
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Profile</h1>

      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{profileData.fullName}</CardTitle>
                <CardDescription className="text-base mb-3">
                  @{profileData.username} • {profileData.email}
                </CardDescription>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{profileData.role}</Badge>
                  <Badge variant="outline">{profileData.institution}</Badge>
                  <Badge variant="outline">Joined {profileData.joinDate}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{profileData.bio}</p>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{profileData.projectsCount}</div>
                <div className="text-sm text-muted-foreground mt-1">Projects</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{profileData.collaborations}</div>
                <div className="text-sm text-muted-foreground mt-1">Collaborations</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-600">24</div>
                <div className="text-sm text-muted-foreground mt-1">Circuits Created</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue={profileData.fullName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue={profileData.username} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={profileData.email} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" defaultValue={profileData.institution} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={profileData.role} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                defaultValue={profileData.bio}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1 bg-special">Save Changes</Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
