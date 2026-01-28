'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';

export default function RegisterPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [match, setMatch] = useState(true);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        try {
            if (data.password !== data.confirm_password) {
                setMatch(false);
                return;
            }

            setMatch(true);
            setLoading(true);
            console.log('Attempting registration with:', data);
            
            // Step 1: Register the user
            const registerRes = await API.post("/auth/register", data);
            console.log('Registration response:', registerRes);
            
            if (registerRes.status !== 201) {
                alert(`Error: ${registerRes.data.message}`);
                setLoading(false);
                return;
            }

            // Step 2: Login the user automatically
            console.log('Registration successful, logging in automatically...');
            const loginRes = await API.post("/auth/login", {
                username: data.username,
                password: data.password
            });
            console.log('Auto-login response:', loginRes);
            
            if (loginRes.status !== 201) {
                alert('Registration successful but auto-login failed. Please login manually.');
                router.push('/login');
                setLoading(false);
                return;
            }

            // Step 3: Get token and store it
            const token = loginRes.data.token;
            localStorage.setItem('authToken', token);
            
            // Step 4: Wait a moment for the token to be set
            setTimeout(async () => {
                try {
                    // Step 5: Get user data
                    const accountRes = await API.get("/private");
                    console.log('User data response:', accountRes);
                    
                    if (accountRes.status === 200 || accountRes.status === 201) {
                        router.push('/donate');
                    } else {
                        console.error('Failed to get user data:', accountRes);
                        alert('Registration and login successful but could not get user data. Please refresh the page.');
                    }
                } catch (privateError) {
                    console.error('Error getting user data:', privateError);
                    alert('Registration and login successful but could not verify account. Please refresh the page.');
                } finally {
                    setLoading(false);
                }
            }, 500);
            
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden flex justify-center items-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="rounded-lg p-6 md:p-10 bg-stone-800/90 flex flex-col space-y-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-center text-red-400">{local.register}</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="email" 
                                id="email" 
                                placeholder={local.email} 
                                autoFocus 
                                {...register("email", { 
                                    required: true, 
                                    pattern: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ 
                                })} 
                            />
                            {errors.email && <p className='text-red-400 text-sm'>{local.emailError}</p>}
                        </div>

                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="text" 
                                id="username" 
                                placeholder={local.username} 
                                {...register("username", { required: true, minLength: 2, maxLength: 16 })} 
                            />
                            {errors.username && <p className='text-red-400 text-sm'>{local.usernameError}</p>}
                        </div>

                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="password" 
                                id="password" 
                                placeholder={local.password} 
                                {...register("password", { required: true, minLength: 2, maxLength: 16 })} 
                            />
                            {errors.password && <p className='text-red-400 text-sm'>{local.passwordError}</p>}
                        </div>

                        <div className="space-y-2">
                            <input 
                                className="rounded-md p-3 w-full bg-stone-700 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-red-400" 
                                type="password" 
                                id="confirm_password" 
                                placeholder={local.confirmPassword} 
                                {...register("confirm_password", { required: true, minLength: 2, maxLength: 16 })} 
                            />
                            {errors.confirm_password && <p className='text-red-400 text-sm'>{local.passwordError}</p>}
                            {!match && <p className='text-red-400 text-sm'>{local.confirmPasswordError}</p>}
                        </div>

                        <button 
                            className="rounded-md p-3 w-full bg-red-400 hover:bg-red-500 text-white font-bold text-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : local.register}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
