import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { createStyles } from 'antd-style'
import { Card, Input, Button, Typography, Form, Flex } from 'antd'

import { onSubmit } from '@/pages/Auth/SignIn/helper'

const { Text } = Typography

const useStyle = createStyles(() => {
  return {
    card: {
      width: 510,
      borderRadius: 30,
      padding: '10px 30px 40px 30px',
      boxShadow: '14px 17px 40px 4px #7090B014',
    },
    header: {
      textAlign: 'center',
      alignItems: 'center',
      marginBottom: 10,
      flexDirection: 'column',
    },
    logo: {
      width: 184,
      height: 'auto',
    },
    title: {
      fontSize: 36,
      fontWeight: 700,
      color: '#080808',
    },
    form: {
      textAlign: 'center',
      alignItems: 'center',
    },
    formTitle: {
      fontSize: 16,
      fontWeight: 400,
      color: '#A3AED0',
    },
    formText: {
      fontSize: 14,
      fontWeight: 500,
      color: '#2B3674',
    },
    input: {
      fontSize: 14,
      fontWeight: 400,
      color: '#A3AED0',
      borderRadius: 16,
      padding: 15,
    },
    forgetPassword: {
      textAlign: 'right',
      marginBottom: 50,
    },
    textForget: {
      color: '#FC0A18',
      fontSize: 14,
      fontWeight: 500,
      marginRight: 20,
    },
    button: {
      fontSize: 14,
      fontWeight: 500,
      color: '#ffffff',
      borderRadius: 16,
      padding: 25,
    },
  }
})

export default function LoginForm() {
  const { styles } = useStyle()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true)
    await onSubmit({ email, password })
    setIsLoading(false)
  }

  return (
    <>
    <Card className={styles.card}>
      <Flex className={styles.header} gap={30}>
        <img src='/icons/logoLogin.png' alt='Logo' className={styles.logo} />
        <div>
          <h2>ISSUE MANAGEMENT</h2>
        </div>
        <Text className={styles.title}>Sign In</Text>
      </Flex>
      <Form layout='vertical' onFinish={handleLogin} className={styles.form}>
        <Form.Item
          label='Email'
          name='email'
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
          className={styles.formText}
        >
          <Input
            placeholder='mail@gmail.com'
            size='large'
            {...register('email')}
            type='email'
            className={styles.input}
          />
        </Form.Item>
        <Form.Item
          label='Password'
          name='password'
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
          className={styles.formText}
        >
          <Input.Password
            placeholder='Min. 8 characters'
            size='large'
            {...register('password')}
            className={styles.input}
          />
        </Form.Item>
        <div className={styles.forgetPassword}>
          <Link to='/forget-password' className={styles.textForget}>
            Forget password?
          </Link>
        </div>
        <Button type='primary' htmlType='submit' size='large' block loading={isLoading} className={styles.button}>
          Sign In
        </Button>
      </Form>
    </Card>
    </>
  )
}
