import { useForm } from 'react-hook-form'

import { onSubmit } from './helper'
import { useState } from 'react'
import { Card, Input, Button, Typography, Form, Flex } from 'antd'
import { createStyles } from 'antd-style'

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
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      flexDirection: 'column',
    },
    logo: {
      width: 184,
      height: 'auto',
    },
    textHeader: {
      alignItems: 'flex-start',
      flexDirection: 'column',
      marginBottom: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: 700,
      color: '#2B3674',
    },
    subTitle: {
      fontSize: 16,
      fontWeight: 400,
      color: '#A3AED0',
    },
    form: {
      textAlign: 'center',
      alignItems: 'center',
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
    button: {
      fontSize: 14,
      fontWeight: 500,
      color: '#ffffff',
      backgroundColor: '#42B4E7',
      borderRadius: 16,
      padding: 25,
    },
  }
})

export default function ForgetPasswordForm() {
  const { styles } = useStyle()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const handleForgetPassword = async ({ email }: { email: string }) => {
    setIsLoading(true)
    await onSubmit({ email })
    setIsLoading(false)
  }

  return (
    <Card className={styles.card}>
      <Flex className={styles.header} gap={30}>
        <img src='/icons/logoLogin.png' alt='Logo' className={styles.logo} />
        <Flex className={styles.textHeader} gap={5}>
          <Text className={styles.title}>Forgot Password?</Text>
          <Text className={styles.subTitle}>
            No problem. Just provide your email, and we’ll send you a password reset link.
          </Text>
        </Flex>
      </Flex>
      <Form layout='vertical' onFinish={handleSubmit(handleForgetPassword)} className={styles.form}>
        <Form.Item
          label='Email'
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email && errors.email.message}
          style={{ width: '100%' }}
          className={styles.formText}
        >
          <Input placeholder='mail@gmail.com' {...register('email')} className={styles.input} />
        </Form.Item>

        <Form.Item>
          <Button htmlType='submit' block loading={isLoading} className={styles.button}>
            Sign Up
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
