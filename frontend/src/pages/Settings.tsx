import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from "@/theme";

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6">
        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your application experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about project updates
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive weekly digest of your activity
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control who can see your profile and projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="privacy"
                  id="public"
                  defaultChecked
                  className="h-4 w-4 cursor-pointer"
                />
                <div className="flex-1">
                  <Label htmlFor="public" className="text-base cursor-pointer">
                    Public profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can view your profile and public projects
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="privacy"
                  id="private"
                  className="h-4 w-4 cursor-pointer"
                />
                <div className="flex-1">
                  <Label htmlFor="private" className="text-base cursor-pointer">
                    Private profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only you and invited collaborators can see your work
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Account Status</p>
                <p className="text-sm text-muted-foreground">Your account is active</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="destructive" className="bg-destructive">Log Out</Button>
              <Button variant="destructive" className="bg-destructive" >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary">Reset to Defaults</Button>
          <Button className="bg-special hover:bg-special-hover" >Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

